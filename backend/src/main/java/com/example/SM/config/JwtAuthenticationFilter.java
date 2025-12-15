package com.example.SM.config;

import com.example.SM.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        System.out.println("🔍 Filter - Request: " + request.getRequestURI());
        System.out.println("🔍 Filter - Auth Header: " + authHeader);

        String username = null;
        String jwt = null;

        // Only process if Authorization header exists and starts with "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            
            try {
                username = jwtUtil.extractUsername(jwt);
                System.out.println("🔍 Filter - Extracted username: " + username);
                
                // Validate token
                if (username != null && jwtUtil.validateToken(jwt, username)) {
                    System.out.println("✅ Filter - Token valid for user: " + username);
                    
                    // Create authentication object
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(username, null, null);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Set authentication in SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    System.out.println("❌ Filter - Token invalid or expired");
                }
            } catch (Exception e) {
                System.err.println("❌ Filter - Error processing JWT: " + e.getMessage());
                // Don't throw exception - just continue without authentication
            }
        } else {
            System.out.println("ℹ️  Filter - No Bearer token found, continuing as anonymous");
        }

        // Always continue the filter chain
        filterChain.doFilter(request, response);
    }
}